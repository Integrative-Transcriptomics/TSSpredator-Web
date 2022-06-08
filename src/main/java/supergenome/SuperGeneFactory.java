
package supergenome;

import genomic.Gene;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class SuperGeneFactory {

	public static List<SuperGene> compareDataSets(Map<String,List<Gene>> geneMap, SuperGenome superG)
	{
		List<SuperGene> suGenes = new LinkedList<SuperGene>();
		Set<Gene> tmpNotGroupedGenes = new HashSet<Gene>();
		List<Gene> tmpGenes2add = new LinkedList<Gene>();
		Map<String,SuperGene> tmpNewSuperGenesToAdd = new HashMap<String,SuperGene>();
		SuperGene tmpSuGene;
		
		//TODO we need some relative measure
		int minAcceptableOverlap = 50;
		
		//supergenomify genes
		geneMap = new HashMap<String, List<Gene>>(geneMap);
		for(String id : geneMap.keySet())
		{
			geneMap.put(id, superG.superGenomifyGenes(id, geneMap.get(id), false));
		}
		
		//for all genomes...
		for(String id : geneMap.keySet())
		{
			//new set of ungrouped genes
			tmpNotGroupedGenes.clear();
			tmpNotGroupedGenes.addAll(geneMap.get(id));
			tmpNewSuperGenesToAdd.clear();
			
			//for all already existing SuperGenes...
			for(SuperGene suG : suGenes)
			{	
				tmpGenes2add.clear();
				//which genes should be added?
				for(Gene g : geneMap.get(id))
				{	
					//Add genes that fit the complete SuperGene
					if(suG.getMinimumUngappedOverlap(g, id) >= minAcceptableOverlap)
					{
						tmpGenes2add.add(g);
					}
					//Create new SuperGenes for partially matching genes
					else
					{
						tmpSuGene = suG.createNewSuperGeneFromMatchingSubset(id, g, minAcceptableOverlap);
						if(tmpSuGene!=null)
						{
							tmpNewSuperGenesToAdd.put(tmpSuGene.getContentHashString(),tmpSuGene);

							tmpNotGroupedGenes.remove(g);
						}
					}
				}
				
				//No genes to add
				if(tmpGenes2add.size()==0)
					continue; 
				
				//Add exactly one gene
				if(tmpGenes2add.size()==1)
				{
					suG.putGenomicGene(id, tmpGenes2add.get(0));
				}
				//More than one gene can be added -> clone SuperGene
				else
				{
					//clone all but one
					for(int i=0; i<tmpGenes2add.size()-1; i++)
					{
						tmpSuGene = suG.clone();
						tmpSuGene.putGenomicGene(id, tmpGenes2add.get(i));
						
						tmpNewSuperGenesToAdd.put(tmpSuGene.getContentHashString(),tmpSuGene);
					}
					//Add last gene to already existing SuperGene
					suG.putGenomicGene(id, tmpGenes2add.get(tmpGenes2add.size()-1));
				}
				
				//remove genes in tmpGenes2add from tmpNotGroupedGenes
				tmpNotGroupedGenes.removeAll(tmpGenes2add);
				
			}
			
			//for all genes that have not been added to a SuperGene -> create new SuperGene
			for(Gene g:tmpNotGroupedGenes)
			{
				tmpSuGene = new SuperGene(superG, true);
				tmpSuGene.putGenomicGene(id, g);
				tmpNewSuperGenesToAdd.put(tmpSuGene.getContentHashString(),tmpSuGene);
			}
			
			suGenes.addAll(tmpNewSuperGenesToAdd.values());
			//TODO something more to finalize here? (for each Genome)
		}
		
		//generate list of SuperGenes that are returned
		//i.e. remove duplicated SuperGenes and SuperGenes that are contained in another
		Map<String,SuperGene> res = new HashMap<String, SuperGene>();
		boolean dontAdd;
		
		for(SuperGene suG:suGenes)
		{
			dontAdd=false;
			for(SuperGene otherSuG:suGenes)
			{
				if(suG.isProperSubsetOfOtherSuperGene(otherSuG))
				{
					dontAdd=true;
					break;
				}
			}
			if(!dontAdd)
				res.put(suG.getContentHashString(), suG);
		}
		
		//TODO something to finalize when all is done? (e.g discard some SuperGenes because of bad alignment or so)
		//TODO also, the genes in the SuperGenes might match pairwise but they maybe do not have a common overlap
		
		return new LinkedList<SuperGene>(res.values());
		
	}
	
	public static List<SuperGene> createSuperGenesFromKonradsOrthologMapping_OLD(Map<String,List<Gene>> geneMap, SuperGenome superG, String orthoMapFileName) throws IOException
	{
		List<SuperGene> suGenes = new LinkedList<SuperGene>();
		SuperGene tmpSuGene;
		Gene tmpGene;
		
		
		//supergenomify genes
		geneMap = new HashMap<String, List<Gene>>(geneMap);
		for(String id : geneMap.keySet())
		{
			geneMap.put(id, superG.superGenomifyGenes(id, geneMap.get(id), false));
		}
		
		//create gene name maps
		Map<String, Map<String,Gene>> geneNameMap = new HashMap<String, Map<String,Gene>>();
		Map<String,Gene> tmpNameMap;
		
		for(String id : geneMap.keySet())
		{
			tmpNameMap = new HashMap<String, Gene>();
			for(Gene g: geneMap.get(id))
			{
				//Konrads file seems to be 0-based end-exclusive
				//tmpNameMap.put(g.getId()+"_"+(g.getStart()-1)+"-"+g.getEnd(), g);
				//tmpNameMap.put(g.getId()+"_"+(superG.getPosInGenome(id, g.getStart())-1)+"-"+superG.getPosInGenome(id, g.getEnd()), g);
				
				tmpGene = superG.genomifySuperGene(id, g);
				
				tmpNameMap.put(g.getId()+"_"+(tmpGene.getStart()-1)+"-"+tmpGene.getEnd(), g);
			}
			geneNameMap.put(id, tmpNameMap);
		}
		
		//read File
		
		BufferedReader br = new BufferedReader(new FileReader(orthoMapFileName));
		
		//first line
		
		String[] indexToGenomeID = br.readLine().split("\\t");
		
		//check ids
		for(String someID:indexToGenomeID)
			if(!geneMap.keySet().contains(someID))
				throw new Error("The ID '"+someID+"' in the header of the ortholog mapping file is not a valid genome ID!");

		//generate SuperGene for each line
		String[] cells;
		for(String line=br.readLine(); line!=null; line=br.readLine())
		{
			//line=line.trim();
			if(line.length()==0)
				continue;
			
			cells = line.split("\\t",-1);
			
			if(cells.length!=indexToGenomeID.length)
			{
				System.out.println("The following line in the ortholog mapping file does not have the correct number of entries:\n"+line+"\nThe line is skipped!");
				continue;
			}
			
			tmpSuGene = new SuperGene(superG, false);
			
			//add genes
			for(int i=0; i<cells.length; i++)
			{
				//no gene
				if(cells[i].length()==0)
					continue;
				
				tmpGene = geneNameMap.get(indexToGenomeID[i]).get(cells[i]);
				
				//did it work
				if(tmpGene==null)
				{
					System.out.println("The gene '"+cells[i]+"' was not found for genome ID "+indexToGenomeID[i]+". Skipping this entry!");
					continue;
				}
				
				//add it
				tmpSuGene.putGenomicGene(indexToGenomeID[i], tmpGene);
			}
			
			if(tmpSuGene.getNumGenomicGenes()>0)
				suGenes.add(tmpSuGene);
		}
		return suGenes;
	}
	
	public static List<SuperGene> createSuperGenesFromKonradsOrthologMapping(Map<String,List<Gene>> geneMap, SuperGenome superG, String orthoMapFileName) throws IOException
	{
		List<SuperGene> suGenes = new LinkedList<SuperGene>();
		SuperGene tmpSuGene;
		Gene tmpGene;
		
		
		//create gene name maps
		Map<String, Map<String,Gene>> geneNameMap = new HashMap<String, Map<String,Gene>>();
		Map<String,Gene> tmpNameMap;
		
		for(String id : geneMap.keySet())
		{
			tmpNameMap = new HashMap<String, Gene>();
			for(Gene g: geneMap.get(id))
			{	
				tmpNameMap.put(g.getId(), g);
			}
			geneNameMap.put(id, tmpNameMap);
		}
		
		//read File
		
		BufferedReader br = new BufferedReader(new FileReader(orthoMapFileName));
		
		//first line
		
		String[] indexToGenomeID = br.readLine().split("\\t");
		
		//check ids
		for(String someID:indexToGenomeID)
			if(!geneMap.keySet().contains(someID))
				throw new Error("The ID '"+someID+"' in the header of the ortholog mapping file is not a valid genome ID!");
		
		//generate SuperGene for each line
		String[] cells;
		for(String line=br.readLine(); line!=null; line=br.readLine())
		{
			//line=line.trim();
			if(line.length()==0)
				continue;
			
			cells = line.split("\\t",-1);
			
			if(cells.length<indexToGenomeID.length)
			{
				System.out.println("The following line in the ortholog mapping file does not have the correct number of entries:\n"+line+"\nThe line is skipped!");
				continue;
			}
			
			tmpSuGene = new SuperGene(superG, false);
			
			//add genes
			for(int i=0; i<indexToGenomeID.length; i++)
			{
				//no gene
				if(cells[i].length()==0)
					continue;
				
				tmpGene = geneNameMap.get(indexToGenomeID[i]).get(cells[i]);
				
				//did it work
				if(tmpGene==null)
				{
					System.out.println("The gene '"+cells[i]+"' was not found for genome ID "+indexToGenomeID[i]+". Skipping this entry!");
					continue;
				}
				
				//add it
				tmpSuGene.putGenomicGene(indexToGenomeID[i], tmpGene);
			}
			
			if(tmpSuGene.getNumGenomicGenes()>0)
				suGenes.add(tmpSuGene);
			
			//TODO still something todo at the end of the line?
		}
		
		//TODO something to do before returning the suGenes?
		return suGenes;
	}
	
}
