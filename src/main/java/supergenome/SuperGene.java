
package supergenome;

import genomic.Gene;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class SuperGene implements Comparable<SuperGene>
{
	private SuperGenome mySuperGenome;
	private Map<String,Gene> genomeGenes;
	private Map<String,Gene> interrogatableRegions;
	private boolean isSuperGenomeBased;
	
	private boolean lengthProblem;
	
	private int interroStart;
	private int interroEnd;
	
	public SuperGene(SuperGenome mySuperGenome, boolean isSuperGenomeBased)
	{
		this.mySuperGenome = mySuperGenome;
		genomeGenes = new HashMap<String, Gene>();
		
		this.isSuperGenomeBased = isSuperGenomeBased;
		lengthProblem=false;
	}
	
	public SuperGene(Map<String, Gene> genes, SuperGenome mySuperGenome, boolean isSuperGenomeBased)
	{
		this.mySuperGenome = mySuperGenome;
		genomeGenes = genes;
		
		this.isSuperGenomeBased = isSuperGenomeBased;
	}
	
	public Gene getGenomicGene(String genomeID)
	{
		return genomeGenes.get(genomeID);
	}
	
	public void putGenomicGene(String genomeID, Gene gene)
	{
		if(genomeGenes.get(genomeID)!=null) {
			System.err.println("Cannot add " + gene.getId() + " to this SuperGene! Contains already " + genomeGenes.get(genomeID).getId() + " for the same Genome.");
			return;
		}
		genomeGenes.put(genomeID, gene);
		
		interrogatableRegions=null;
		interroStart         =0;
		interroEnd           =0;
	}
	
	public boolean hasGeneForGenome(String genomeID)
	{
		return genomeGenes.containsKey(genomeID);
	}
	
	public int getNumGenomicGenes()
	{
		return genomeGenes.size();
	}
	
	public int getMinimumUngappedOverlap(Gene gene, String theGenesGenomeID)
	{
		int min = Integer.MAX_VALUE;
		int[] tmpOv;
		List<String> idList = new LinkedList<String>(genomeGenes.keySet());
		idList.add(theGenesGenomeID);
		
		for(Gene g:genomeGenes.values())
		{
			//if starnds do not match the gene cannot be added
			if(gene.getStrand()!=g.getStrand())
				return 0;
			
			tmpOv = gene.getOverlapStartEnd(g);
			
			//No overlap?
			if(tmpOv==null)
				return 0;
			
			min = Math.min(min, mySuperGenome.getNumUngappedColumnsInRegion(tmpOv[0],tmpOv[1],idList));
		}
		
		return min;
	}
	
	public SuperGene createNewSuperGeneFromMatchingSubset(String genomeID, Gene gene, int minAcceptableOverlap)
	{
		Map<String,Gene> acceptableSubset = new HashMap<String, Gene>();
		
		Gene g;
		int[] tmpOv;
		List<String> idList = new LinkedList<String>();
		
		//for all genes in this SuperGene...
		for(String id : genomeGenes.keySet())
		{
			g = genomeGenes.get(id);
			
			idList.clear();
			idList.add(id);
			idList.add(genomeID);
			
			tmpOv = gene.getOverlapStartEnd(g);
			
			//matches with new gene?
			if(tmpOv != null && mySuperGenome.getNumUngappedColumnsInRegion(tmpOv[0],tmpOv[1],idList) >= minAcceptableOverlap && g.getStrand()==gene.getStrand())
				acceptableSubset.put(id, g);		
		}
		
		//if there is no matching subset
		if(acceptableSubset.size()==0)
			return null;
		
		acceptableSubset.put(genomeID, gene);
		
		return new SuperGene(acceptableSubset, this.mySuperGenome, this.isSuperGenomeBased);
	}
	
	public Map<String, Gene> getInterrogatableRegions()
	{
		if(interrogatableRegions==null)
			setInterrogatableRegions();
		
		return interrogatableRegions;
	}
	
	private void setInterrogatableRegions()
	{
		if(isSuperGenomeBased)
		{
			setSuperGenomeBasedInterrogatableRegions();
			return;
		}
		
		//prepare ortholog based regions
		
		HashMap<String, Gene> orthoBasedInterrogatableRegions = new HashMap<String, Gene>();
		
		for(String id:genomeGenes.keySet())
		{
			orthoBasedInterrogatableRegions.put(id, genomeGenes.get(id));
		}
		
		//SuperGenome based approach necessary? Check gene lengths!
		boolean equalLength = true;
		int lastLength = -1;
		
		for(String id:genomeGenes.keySet())
		{
			if(lastLength==-1)
				lastLength=genomeGenes.get(id).getLength();
			else
				if(lastLength!=genomeGenes.get(id).getLength())
					equalLength=false;
		}
		
		//If SuperGenome based approach NOT necessary,
		//set regions and return.
		if(equalLength)
		{
			this.interrogatableRegions=orthoBasedInterrogatableRegions;
			return;
		}
		
		//If SuperGenome based approach IS necessary...
		//TODO debug
		//System.err.print(this.getContentHashString()+": SuperGenome based approach!");
		
		lengthProblem=true;
		
		//Backup genomic genes
		Map<String,Gene> genomeGenesBak = new HashMap<String, Gene>(genomeGenes);
		
		//SuperGenomify genome genes
		Gene tmpG;
		for(String id:genomeGenes.keySet())
		{
			tmpG = mySuperGenome.superGenomifyGene(id, genomeGenes.get(id), false);
			
			//If this did not work:
			//Restore original genome genes
			//return and thus use ortholog based regions
			if(tmpG==null)
			{
				//TODO debug
				//System.err.println(" - Not all genes supergenomifyable!");
				this.interrogatableRegions=orthoBasedInterrogatableRegions;
				this.genomeGenes=genomeGenesBak;
				return;
			}
			
			genomeGenes.put(id, tmpG);
		}
		
		//Set SuperGenome based regions
		setSuperGenomeBasedInterrogatableRegions();
		
		//Restore original Genes
		genomeGenes = genomeGenesBak;
		
		//If this did not work (no regions set or not for all genes):
		//use ortholog based regions
		if(interrogatableRegions==null || interrogatableRegions.size()!=orthoBasedInterrogatableRegions.size())
		{
			//TODO debug
			//System.err.println(" - No common region found!");
			this.interrogatableRegions=orthoBasedInterrogatableRegions;
			return;
		}
		
		//Regions to small?
		for(String id:interrogatableRegions.keySet())
		{
			if(interrogatableRegions.get(id).getLength()<50 && genomeGenes.get(id).getLength()>=50)
			{
				//TODO debug
				//System.err.println(" -  Common region to short!");
				this.interrogatableRegions=orthoBasedInterrogatableRegions;
				return;
			}
		}
		
		lengthProblem=false;
		
		//TODO debug
		//System.err.println(" - success!");
		//TODO check this again, are we done here?
		//TODO add some debug messages? Why not.
	}
	
	private void setSuperGenomeBasedInterrogatableRegions()
	{
		int tmpSuStart = Integer.MIN_VALUE;
		int tmpSuEnd   = Integer.MAX_VALUE;
		
		//Set borders for interrogatable region on SuperGenome level
		Gene tmpG;
		for(String id : genomeGenes.keySet())
		{
			tmpG = genomeGenes.get(id);
			
			tmpSuStart = Math.max(tmpSuStart, tmpG.getStart());
			tmpSuEnd   = Math.min(tmpSuEnd,   tmpG.getEnd());
		}
		
		//if there is no region
		if(tmpSuEnd < tmpSuStart)
			return;
		
		interroStart = tmpSuStart;
		interroEnd	 = tmpSuEnd;
		
		//initialize
		interrogatableRegions = new HashMap<String, Gene>();
		
		int tmpGStart;
		int tmpGEnd;
		char tmpStrand;
		int tmp;
		
		//Set borders for interrogatable region on _genome_ level
		for(String id : genomeGenes.keySet())
		{
			tmpG = genomeGenes.get(id);
			
			tmpGStart = mySuperGenome.getNextMappingPosInGenome(id, tmpSuStart);
			tmpGEnd = mySuperGenome.getNextMappingPosInGenome(id, tmpSuEnd);
			
			//Skip this gene if start and end map to different strands
			if(Math.signum(tmpGStart)!=Math.signum(tmpGEnd))
				continue;
			
			//strand
			tmpStrand = tmpG.getStrand();
			
			//switch strand?
			if(tmpGStart < 0)
			{
				//this means that start and end have to be swapped
				tmp=tmpGStart;
				tmpGStart=tmpGEnd;
				tmpGEnd=tmp;
				
				//toggle strand
				tmpStrand = toggleStrand(tmpStrand);
			}
			
			//get 'strandless' positions
			tmpGStart = Math.abs(tmpGStart);
			tmpGEnd   = Math.abs(tmpGEnd);
			
			//no region for this gene?
			if(tmpGEnd < tmpGStart)
				continue;
			
			interrogatableRegions.put(id, new Gene(tmpG.getSource(), tmpG.getOrigin(), tmpG.getId(), tmpG.getType(), tmpGStart, tmpGEnd, tmpStrand, tmpG.getDescription()));
		}
		
		//no gene left
		if(interrogatableRegions.size()==0)
			interrogatableRegions = null;
	}
	
	private char toggleStrand(char strand)
	{
		char res;
		
		switch(strand)
		{
		case '+': res = '-'; break;
		case '-': res = '+'; break;
		case '.': res = '.'; break;
		default:  res = '.'; //System.err.println("Warning: Invalid strand identifier in toggleStrand function: "+strand);
		}
		
		return res;
	}
	
	public boolean isProperSubsetOfOtherSuperGene(SuperGene otherSuperGene)
	{
		Map<String,Gene> otherRegions = otherSuperGene.getInterrogatableRegions();
		
		if(otherRegions==null)
			return false;
		
		if(interrogatableRegions==null)
			setInterrogatableRegions();
		
		if(interrogatableRegions==null)
			return false;
		
		if(this.getContentHashString().equals(otherSuperGene.getContentHashString()))
			return false;
		
		boolean res = true;
		for(String id:interrogatableRegions.keySet())
			if(otherRegions.get(id)==null || interrogatableRegions.get(id).getId()!=otherRegions.get(id).getId())
				return false;
		
		//TODO print debug
		//System.err.println(this.getContentHashString()+"is a subset of "+otherSuperGene.getContentHashString());
		
		return res;
	}
	
	public String getID()
	{
		if(interrogatableRegions==null)
			setInterrogatableRegions();
		
		if(interrogatableRegions==null)
			return "";
		
		StringBuffer res = new StringBuffer();
		
		for(Gene g : interrogatableRegions.values())
			res.append(g.getId()+"_");
		
		res.deleteCharAt(res.length()-1); 
		

		return res.toString();
	}
	
	
	public String getContentHashString()
	{
		StringBuffer res = new StringBuffer();
		
		List<String> ids = new LinkedList<String>(genomeGenes.keySet());
		Collections.sort(ids);
		
		for(String id:ids)
		{
			res.append(id+":"+genomeGenes.get(id).getId()+";");
		}
		
		return res.toString();
	}
	
	public SuperGene clone()
	{
		return new SuperGene(new HashMap<String, Gene>(genomeGenes), this.mySuperGenome, this.isSuperGenomeBased);
		
		//TODO check at the end if this has to be extended
	}

	@Override
	public int compareTo(SuperGene o)
	{
		if(interrogatableRegions==null)
			setInterrogatableRegions();
		
		if(o.interrogatableRegions==null)
			o.setInterrogatableRegions();
		
		return this.interroStart - o.interroStart;
	}

	public boolean isSuperGenomeBased()
	{
		return isSuperGenomeBased;
	}
	
	public boolean hasLengthProblem()
	{
		return lengthProblem;
	}

// If the SuperGene is not SuperGenome based the genome genes are based on genomic coordinates and not on SuperGenome coordinates.
//	public void setSuperGenomeBased(boolean isSuperGenomeBased)
//	{
//		if(this.isSuperGenomeBased==isSuperGenomeBased)
//			return;
//		
//		this.isSuperGenomeBased = isSuperGenomeBased;
//		
//		interrogatableRegions = null;
//		interroStart         =0;
//		interroEnd           =0;
//	}
}
